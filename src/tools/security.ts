import { createHash } from 'node:crypto';
import { HashAlgorithm } from '../types.js';

export const securityTools = {
  hashData: {
    name: 'hashData',
    description: 'Hash input data using Node.js crypto module',
    inputSchema: {
      type: 'object',
      properties: {
        input: {
          type: 'string',
          description: 'Data to hash'
        },
        algorithm: {
          type: 'string',
          description: 'Hash algorithm to use',
          enum: ['md5', 'sha1', 'sha256', 'sha512'],
          default: 'sha256'
        },
        encoding: {
          type: 'string',
          description: 'Output encoding',
          enum: ['hex', 'base64'],
          default: 'hex'
        }
      },
      required: ['input']
    },
    handler: async ({ 
      input, 
      algorithm = 'sha256', 
      encoding = 'hex' 
    }: { 
      input: string; 
      algorithm?: HashAlgorithm; 
      encoding?: 'hex' | 'base64' 
    }) => {
      try {
        const hash = createHash(algorithm)
          .update(input)
          .digest(encoding);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              input,
              algorithm,
              encoding,
              hash
            }, null, 2)
          }]
        };
      } catch (error) {
        throw new Error(`Hashing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  },

  compareHashes: {
    name: 'compareHashes',
    description: 'Compare two hashes in constant time',
    inputSchema: {
      type: 'object',
      properties: {
        hash1: {
          type: 'string',
          description: 'First hash to compare'
        },
        hash2: {
          type: 'string',
          description: 'Second hash to compare'
        }
      },
      required: ['hash1', 'hash2']
    },
    handler: async ({ hash1, hash2 }: { hash1: string; hash2: string }) => {
      try {
        // Convert strings to buffers for constant-time comparison
        const buf1 = Buffer.from(hash1);
        const buf2 = Buffer.from(hash2);

        // Ensure same length to prevent timing attacks
        if (buf1.length !== buf2.length) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                match: false,
                reason: 'Length mismatch'
              }, null, 2)
            }]
          };
        }

        // Constant-time comparison
        const match = Buffer.compare(buf1, buf2) === 0;

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              match,
              hash1Length: buf1.length,
              hash2Length: buf2.length
            }, null, 2)
          }]
        };
      } catch (error) {
        throw new Error(`Hash comparison failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }
};