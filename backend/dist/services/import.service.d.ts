export interface ImportRowError {
    row: number;
    field?: string;
    message: string;
}
export interface ImportResult {
    total: number;
    success: number;
    failed: number;
    errors: ImportRowError[];
    preview?: Record<string, string>[];
}
export declare function parseCSV(buffer: Buffer): Record<string, string>[];
export declare function validateStudentRows(rows: Record<string, string>[]): ImportResult;
export declare function validateCoachRows(rows: Record<string, string>[]): ImportResult;
export declare function importStudents(academyId: string, rows: Record<string, string>[]): Promise<ImportResult>;
export declare function importCoaches(academyId: string, rows: Record<string, string>[], defaultPassword: string): Promise<ImportResult>;
export declare const STUDENT_TEMPLATE = "firstName,lastName,email,phone,guardianName,guardianPhone,guardianEmail\nJohn,Doe,john@example.com,9876543210,Jane Doe,9876543211,jane@example.com";
export declare const COACH_TEMPLATE = "firstName,lastName,email,phone,password\nAlex,Smith,alex@example.com,9876543210,Coach@123";
//# sourceMappingURL=import.service.d.ts.map