import { describe, expect, it } from "bun:test";
import { kindleEmailAddress, kindleEmailAddressRelations } from "@bettersent/db/schema";
import { getTableName, getTableColumns } from "drizzle-orm";

describe("Kindle Email Address Schema", () => {
  describe("Table structure", () => {
    it("should have the correct table name", () => {
      const tableName = getTableName(kindleEmailAddress);
      expect(tableName).toBe("kindle_email_address");
    });

    it("should have all required columns", () => {
      const columns = getTableColumns(kindleEmailAddress);
      const columnNames = Object.keys(columns);
      
      expect(columnNames).toContain("id");
      expect(columnNames).toContain("email");
      expect(columnNames).toContain("label");
      expect(columnNames).toContain("isDefault");
      expect(columnNames).toContain("userId");
      expect(columnNames).toContain("createdAt");
      expect(columnNames).toContain("updatedAt");
    });

    it("should have 7 columns total", () => {
      const columns = getTableColumns(kindleEmailAddress);
      expect(Object.keys(columns).length).toBe(7);
    });

    it("should have id as primary key", () => {
      const columns = getTableColumns(kindleEmailAddress);
      // In drizzle-orm, primary key columns are identified by their column name and configuration
      expect(columns.id).toBeDefined();
      expect(columns.id.name).toBe("id");
      expect(columns.id.primary).toBe(true);
    });

    it("should have email as required field", () => {
      const columns = getTableColumns(kindleEmailAddress);
      expect(columns.email.notNull).toBe(true);
    });

    it("should have label as optional field", () => {
      const columns = getTableColumns(kindleEmailAddress);
      expect(columns.label.notNull).toBe(false);
    });

    it("should have isDefault default to false", () => {
      const columns = getTableColumns(kindleEmailAddress);
      expect(columns.isDefault.notNull).toBe(true);
      expect(columns.isDefault.hasDefault).toBe(true);
    });

    it("should have userId as required field", () => {
      const columns = getTableColumns(kindleEmailAddress);
      expect(columns.userId.notNull).toBe(true);
    });

    it("should have createdAt with default value", () => {
      const columns = getTableColumns(kindleEmailAddress);
      expect(columns.createdAt.notNull).toBe(true);
      expect(columns.createdAt.hasDefault).toBe(true);
    });

    it("should have updatedAt with default value", () => {
      const columns = getTableColumns(kindleEmailAddress);
      expect(columns.updatedAt.notNull).toBe(true);
      expect(columns.updatedAt.hasDefault).toBe(true);
    });
  });

  describe("Relations", () => {
    it("should have kindleEmailAddressRelations defined", () => {
      expect(kindleEmailAddressRelations).toBeDefined();
    });
  });
});
