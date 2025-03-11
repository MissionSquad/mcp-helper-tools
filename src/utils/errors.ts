import { ErrorCode } from '@modelcontextprotocol/sdk/types.js';

export class McpToolError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public data?: unknown
  ) {
    super(message);
    this.name = 'McpToolError';
  }
}

export function handleToolError(error: unknown): {
  isError: true;
  content: Array<{ type: 'text'; text: string }>;
} {
  if (error instanceof McpToolError) {
    return {
      isError: true,
      content: [{
        type: 'text',
        text: `Error ${error.code}: ${error.message}${error.data ? `\nDetails: ${JSON.stringify(error.data)}` : ''}`
      }]
    };
  }

  // Handle unknown errors
  return {
    isError: true,
    content: [{
      type: 'text',
      text: `Internal error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }]
  };
}

export function validateInput<T>(
  input: unknown,
  validator: (input: unknown) => input is T,
  errorMessage: string
): T {
  if (!validator(input)) {
    throw new McpToolError(
      ErrorCode.InvalidParams,
      errorMessage
    );
  }
  return input;
}