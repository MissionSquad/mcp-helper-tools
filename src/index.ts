#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { geoTools } from './tools/geo.js';
import { generatorTools } from './tools/generator.js';
import { dateTimeTools } from './tools/datetime.js';
import { securityTools } from './tools/security.js';
import { McpToolError, handleToolError } from './utils/errors.js';
import { RateLimiter, systemRateLimiter, networkRateLimiter, geoRateLimiter } from './utils/rate-limiter.js';
import { withProgress, ProgressReporter } from './utils/progress.js';

// Combine all tools
import { ToolKit, Tool } from './types.js';
import { encodingTools } from './tools/encoding.js';

// Update Tool interface to support progress reporting
declare module './types.js' {
  interface Tool {
    handler: (args: any, progress?: ProgressReporter) => Promise<{
      content: Array<{ type: string; text: string }>;
      isError?: boolean;
    }>;
  }
}

const allTools: ToolKit = {
  ...encodingTools,
  ...geoTools,
  ...generatorTools,
  ...dateTimeTools,
  ...securityTools
};

class ToolkitServer {
  private server: Server;
  private isShuttingDown: boolean = false;

  constructor() {
    this.server = new Server(
      {
        name: 'toolkit-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          progress: {}
        }
      }
    );

    this.setupHandlers();
    this.setupErrorHandling();
    this.setupCleanup();
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
      if (!this.isShuttingDown) {
        // Attempt to notify clients of the error
        this.server.notification({
          method: 'notifications/server/error',
          params: {
            error: error instanceof Error ? error.message : 'Unknown error occurred'
          }
        }).catch(console.error);
      }
    };
  }

  private setupCleanup(): void {
    const cleanup = async () => {
      this.isShuttingDown = true;
      console.log('Shutting down toolkit-mcp-server...');
      
      try {
        // Notify clients of shutdown
        await this.server.notification({
          method: 'notifications/server/shutdown',
          params: {
            reason: 'Server is shutting down'
          }
        });

        // Close server connection
        await this.server.close();
        
        console.log('Server shutdown complete');
        process.exit(0);
      } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
      }
    };

    // Handle termination signals
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('uncaughtException', (error) => {
      console.error('Uncaught exception:', error);
      cleanup().catch(console.error);
    });
  }

  private setupHandlers(): void {
    // Handle tool listing
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      try {
        return {
          tools: Object.entries(allTools).map(([name, tool]) => ({
            name,
            description: tool.description,
            inputSchema: tool.inputSchema
          }))
        };
      } catch (error) {
        throw new McpToolError(
          ErrorCode.InternalError,
          'Failed to list tools',
          error instanceof Error ? error.message : undefined
        );
      }
    });

    // Handle tool execution
    this.server.setRequestHandler(CallToolRequestSchema, async (request, extra) => {
      try {
        const tool = allTools[request.params.name as keyof typeof allTools];
        
        if (!tool) {
          throw new McpToolError(
            ErrorCode.MethodNotFound,
            `Tool not found: ${request.params.name}`
          );
        }

        // Get appropriate rate limiter based on tool category
        let rateLimiter: RateLimiter;
        if (request.params.name.startsWith('get_system')) {
          rateLimiter = systemRateLimiter;
        } else if (request.params.name.startsWith('get_network') ||
                  request.params.name === 'ping_host' ||
                  request.params.name === 'traceroute') {
          rateLimiter = networkRateLimiter;
        } else if (request.params.name === 'geolocate') {
          rateLimiter = geoRateLimiter;
        } else {
          rateLimiter = systemRateLimiter; // default to system rate limiter
        }

        // Execute tool with rate limiting and progress reporting
        const result = await rateLimiter.withRateLimit(request.params.name, async () => {
          return await withProgress(
            this.server,
            {
              title: `Executing ${request.params.name}`,
              unit: 'operations'
            },
            async (progress) => {
              const toolResult = await tool.handler(request.params.arguments, progress);
              await progress.complete();
              return toolResult;
            }
          );
        });

        // Convert ToolResponse to ServerResult format
        return {
          content: result.content,
          _meta: result.isError ? { isError: true } : undefined
        };
      } catch (error) {
        if (error instanceof McpToolError) {
          throw error;
        }
        const errorResult = handleToolError(error);
        return {
          content: errorResult.content,
          _meta: { isError: true }
        };
      }
    });
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Toolkit MCP server running on stdio');

    // Handle process termination
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await this.server.close();
      process.exit(0);
    });
  }
}

// Start the server
const server = new ToolkitServer();
server.run().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});