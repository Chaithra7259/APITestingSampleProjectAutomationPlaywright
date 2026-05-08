import fs from 'fs';
import path from 'path';
import Ajv from 'ajv';
import { expect as baseExpect, type APIResponse } from '@playwright/test';

const ajv = new Ajv({ allErrors: true, strict: false });

/**
 * Build the schema folder path for a given endpoint folder name.
 */
function getSchemaDirectory(folder: string) {
  return path.join(process.cwd(), 'schemas', folder);
}

/**
 * Build the full file path for a schema file.
 */
function getSchemaFilePath(folder: string, fileName: string) {
  return path.join(getSchemaDirectory(folder), `${fileName}.schema.json`);
}

/**
 * Generate a minimal JSON schema from a body payload.
 *
 * Recursively infers primitive and nested object types to create a basic schema.
 */
function generateJsonSchema(data: unknown): unknown {
  if (data === null) {
    return { type: 'null' };
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return { type: 'array', items: {} };
    }

    const itemSchemas = data.map((item) =>
      JSON.stringify(generateJsonSchema(item))
    );
    const uniqueSchemas = Array.from(new Set(itemSchemas)).map((schema) =>
      JSON.parse(schema)
    );

    return {
      type: 'array',
      items:
        uniqueSchemas.length === 1
          ? uniqueSchemas[0]
          : { anyOf: uniqueSchemas },
    };
  }

  const typeOf = typeof data;
  if (typeOf === 'string') {
    return { type: 'string' };
  }
  if (typeOf === 'number') {
    return Number.isInteger(data as number)
      ? { type: 'integer' }
      : { type: 'number' };
  }
  if (typeOf === 'boolean') {
    return { type: 'boolean' };
  }

  if (typeOf === 'object') {
    const obj = data as Record<string, unknown>;
    const properties: Record<string, unknown> = {};
    const required = Object.keys(obj);

    for (const [key, value] of Object.entries(obj)) {
      properties[key] = generateJsonSchema(value);
    }

    return {
      type: 'object',
      properties,
      required,
      additionalProperties: true,
    };
  }

  return {};
}

/**
 * Write a generated schema to disk.
 */
function writeSchema(folder: string, fileName: string, schema: unknown) {
  const directory = getSchemaDirectory(folder);
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(
    getSchemaFilePath(folder, fileName),
    JSON.stringify(schema, null, 2),
    'utf8'
  );
}

/**
 * Read a schema file from disk.
 * Throws if the schema file is missing.
 */
function readSchema(folder: string, fileName: string) {
  const schemaPath = getSchemaFilePath(folder, fileName);
  if (!fs.existsSync(schemaPath)) {
    throw new Error(
      `Schema file not found: ${schemaPath}. ` +
        `Run test with generateSchema=true to create it.`
    );
  }
  return JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
}

/**
 * Custom expect matcher for JSON schema validation.
 */
const expect = baseExpect.extend({
  async shouldMatchSchema(
    received: APIResponse,
    folder: string,
    fileName: string,
    generateSchema = false
  ) {
    let body: unknown;
    try {
      body = await received.json();
    } catch {
      body = null;
    }

    // Handle empty responses
    if (body === null) {
      if (received.status() === 204) {
        return {
          pass: true,
          message: () => 'No schema validation required for 204 response.',
        };
      }
      return {
        pass: false,
        message: () =>
          `Expected response to match schema "${folder}/${fileName}", but ` +
          `the body was invalid or empty.`,
      };
    }

    const schema = generateJsonSchema(body);

    // Generate schema if requested
    if (generateSchema) {
      writeSchema(folder, fileName, schema);
      return {
        pass: true,
        message: () =>
          `Schema generated at schemas/${folder}/${fileName}.schema.json`,
      };
    }

    // Validate against saved schema
    const savedSchema = readSchema(folder, fileName);
    const valid = ajv.validate(savedSchema, body);

    if (!valid) {
      const errors = ajv.errors
        ? ajv.errors
            .map((error) => `${error.instancePath} ${error.message}`)
            .join('; ')
        : 'unknown validation error';
      return {
        pass: false,
        message: () =>
          `Schema validation failed for "${folder}/${fileName}": ${errors}`,
      };
    }

    return {
      pass: true,
      message: () =>
        `Response matches schema "${folder}/${fileName}".`,
    };
  },
}) as any;

export { expect };
