/**
 * Seed file for transformation system
 *
 * This file contains sample data schemas and mappings for testing
 * the transformation system.
 */

import { DataType } from "./types";

/**
 * Sample data schemas
 */
export const sampleSchemas = [
  // Customer schema
  {
    id: "customer_schema",
    name: "Customer Schema",
    description: "Standard customer data format",
    fields: [
      {
        name: "id",
        path: "id",
        type: DataType.String,
        description: "Customer ID",
        required: true,
      },
      {
        name: "name",
        path: "name",
        type: DataType.Object,
        description: "Customer name",
        nested: [
          {
            name: "firstName",
            path: "name.firstName",
            type: DataType.String,
            description: "Customer first name",
          },
          {
            name: "lastName",
            path: "name.lastName",
            type: DataType.String,
            description: "Customer last name",
          },
        ],
      },
      {
        name: "email",
        path: "email",
        type: DataType.String,
        description: "Customer email address",
        required: true,
      },
      {
        name: "phone",
        path: "phone",
        type: DataType.String,
        description: "Customer phone number",
      },
      {
        name: "createdAt",
        path: "createdAt",
        type: DataType.Date,
        description: "Customer creation timestamp",
      },
      {
        name: "status",
        path: "status",
        type: DataType.String,
        description: "Customer status (active, inactive)",
      },
      {
        name: "orders",
        path: "orders",
        type: DataType.Array,
        description: "Customer orders",
        isArray: true,
      },
    ],
  },
  // Contact schema
  {
    id: "contact_schema",
    name: "Contact Schema",
    description: "Standard contact data format",
    fields: [
      {
        name: "contactId",
        path: "contactId",
        type: DataType.String,
        description: "Contact ID",
        required: true,
      },
      {
        name: "firstName",
        path: "firstName",
        type: DataType.String,
        description: "Contact first name",
        required: true,
      },
      {
        name: "lastName",
        path: "lastName",
        type: DataType.String,
        description: "Contact last name",
        required: true,
      },
      {
        name: "emailAddress",
        path: "emailAddress",
        type: DataType.String,
        description: "Contact email address",
      },
      {
        name: "phoneNumber",
        path: "phoneNumber",
        type: DataType.String,
        description: "Contact phone number",
      },
      {
        name: "dateCreated",
        path: "dateCreated",
        type: DataType.Date,
        description: "Contact creation date",
      },
      {
        name: "active",
        path: "active",
        type: DataType.Boolean,
        description: "Whether the contact is active",
      },
      {
        name: "notes",
        path: "notes",
        type: DataType.String,
        description: "Additional notes",
      },
    ],
  },
  // Product schema
  {
    id: "product_schema",
    name: "Product Schema",
    description: "Standard product data format",
    fields: [
      {
        name: "id",
        path: "id",
        type: DataType.String,
        description: "Product ID",
        required: true,
      },
      {
        name: "name",
        path: "name",
        type: DataType.String,
        description: "Product name",
        required: true,
      },
      {
        name: "description",
        path: "description",
        type: DataType.String,
        description: "Product description",
      },
      {
        name: "price",
        path: "price",
        type: DataType.Number,
        description: "Product price",
        required: true,
      },
      {
        name: "stock",
        path: "stock",
        type: DataType.Number,
        description: "Current stock level",
      },
      {
        name: "categories",
        path: "categories",
        type: DataType.Array,
        description: "Product categories",
        isArray: true,
      },
    ],
  },
  // Order schema
  {
    id: "order_schema",
    name: "Order Schema",
    description: "Standard order data format",
    fields: [
      {
        name: "id",
        path: "id",
        type: DataType.String,
        description: "Order ID",
        required: true,
      },
      {
        name: "customerId",
        path: "customerId",
        type: DataType.String,
        description: "Customer ID",
        required: true,
      },
      {
        name: "orderDate",
        path: "orderDate",
        type: DataType.Date,
        description: "Date when the order was placed",
        required: true,
      },
      {
        name: "status",
        path: "status",
        type: DataType.String,
        description: "Order status",
        required: true,
      },
      {
        name: "total",
        path: "total",
        type: DataType.Number,
        description: "Order total amount",
        required: true,
      },
      {
        name: "items",
        path: "items",
        type: DataType.Array,
        description: "Order items",
        isArray: true,
        nested: [
          {
            name: "productId",
            path: "items[].productId",
            type: DataType.String,
            description: "Product ID",
          },
          {
            name: "quantity",
            path: "items[].quantity",
            type: DataType.Number,
            description: "Quantity ordered",
          },
          {
            name: "price",
            path: "items[].price",
            type: DataType.Number,
            description: "Price per unit",
          },
        ],
      },
    ],
  },
];

/**
 * Sample mapping configurations
 */
export const sampleMappings = [
  {
    id: "customer_to_contact",
    name: "Customer to Contact Mapping",
    description: "Maps customer data to contact format",
    sourceSchema: "customer_schema",
    targetSchema: "contact_schema",
    mappings: [
      {
        sourceField: "id",
        targetField: "contactId",
      },
      {
        sourceField: "name.firstName",
        targetField: "firstName",
      },
      {
        sourceField: "name.lastName",
        targetField: "lastName",
      },
      {
        sourceField: "email",
        targetField: "emailAddress",
      },
      {
        sourceField: "phone",
        targetField: "phoneNumber",
      },
      {
        sourceField: "createdAt",
        targetField: "dateCreated",
      },
      {
        sourceField: "status",
        targetField: "active",
        transformation: {
          functionId: "string.transform",
          parameters: {
            condition: "active",
            trueValue: true,
            falseValue: false,
          },
        },
      },
    ],
  },
];

/**
 * Function to seed initial data schemas and mappings
 */
export async function seedTransformationData(db: any): Promise<void> {
  // Insert sample schemas
  for (const schema of sampleSchemas) {
    try {
      await db
        .query("data_schemas")
        .filter((q) => q.eq(q.field("id"), schema.id))
        .first()
        .then(async (existing) => {
          if (!existing) {
            await db.insert("data_schemas", {
              ...schema,
              updatedAt: Date.now(),
              isSystem: true,
            });
            console.log(`Created schema: ${schema.name}`);
          }
        });
    } catch (error) {
      console.error(`Error creating schema ${schema.id}:`, error);
    }
  }

  // Insert sample mappings
  for (const mapping of sampleMappings) {
    try {
      await db
        .query("mapping_configurations")
        .filter((q) => q.eq(q.field("id"), mapping.id))
        .first()
        .then(async (existing) => {
          if (!existing) {
            await db.insert("mapping_configurations", {
              ...mapping,
              updatedAt: Date.now(),
              isSystem: true,
            });
            console.log(`Created mapping: ${mapping.name}`);
          }
        });
    } catch (error) {
      console.error(`Error creating mapping ${mapping.id}:`, error);
    }
  }
}
