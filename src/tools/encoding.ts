export const encodingTools = {
  encodeBase64: {
    name: 'encodeBase64',
    description: 'Encode input data to Base64',
    inputSchema: {
      type: 'object',
      properties: {
        input: {
          type: 'string',
          description: 'Data to encode'
        }
      },
      required: ['input']
    },
    handler: async ({ input }: { input: string }) => {
      const encoded = Buffer.from(input).toString('base64');
      return {
        content: [
          {
            type: 'text',
            text: encoded
          }
        ]
      };
    }
  },
  decodeBase64: {
    name: 'decodeBase64',
    description: 'Decode Base64 input data',
    inputSchema: {
      type: 'object',
      properties: {
        input: {
          type: 'string',
          description: 'Data to decode'
        }
      },
      required: ['input']
    },
    handler: async ({ input }: { input: string }) => {
      const decoded = Buffer.from(input, 'base64').toString('utf-8');
      return {
        content: [
          {
            type: 'text',
            text: decoded
          }
        ]
      };
    }
  },
  encodeUrl: {
    name: 'encodeUrl',
    description: 'Encode input data to URL-encoded format',
    inputSchema: {
      type: 'object',
      properties: {
        input: {
          type: 'string',
          description: 'Data to encode'
        }
      },
      required: ['input']
    },
    handler: async ({ input }: { input: string }) => {
      const encoded = encodeURIComponent(input);
      return {
        content: [
          {
            type: 'text',
            text: encoded
          }
        ]
      };
    }
  },
  decodeUrl: {
    name: 'decodeUrl',
    description: 'Decode URL-encoded input data',
    inputSchema: {
      type: 'object',
      properties: {
        input: {
          type: 'string',
          description: 'Data to decode'
        }
      },
      required: ['input']
    },
    handler: async ({ input }: { input: string }) => {
      const decoded = decodeURIComponent(input);
      return {
        content: [
          {
            type: 'text',
            text: decoded
          }
        ]
      };
    }
  },
  encodeHtml: {
    name: 'encodeHtml',
    description: 'Encode input data to HTML-encoded format',
    inputSchema: {
      type: 'object',
      properties: {
        input: {
          type: 'string',
          description: 'Data to encode'
        }
      },
      required: ['input']
    },
    handler: async ({ input }: { input: string }) => {
      const encoded = input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
      return {
        content: [
          {
            type: 'text',
            text: encoded
          }
        ]
      };
    }
  },
  decodeHtml: {
    name: 'decodeHtml',
    description: 'Decode HTML-encoded input data',
    inputSchema: {
      type: 'object',
      properties: {
        input: {
          type: 'string',
          description: 'Data to decode'
        }
      },
      required: ['input']
    },
    handler: async ({ input }: { input: string }) => {
      const decoded = input
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'");
      return {
        content: [
          {
            type: 'text',
            text: decoded
          }
        ]
      };
    }
  }
}