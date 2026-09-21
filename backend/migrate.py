"""
One-time migration: import the master Excel workbook into MongoDB.

Usage:
    python3 migrate.py "data/Y23 Skill Certification Details_ 10-08-26.xlsx"
"""

import sys

from excel_import import import_workbook

if __name__ == "__main__":

    if len(sys.argv) != 2:
        print("Usage: python3 migrate.py <path-to-excel-file>")
        sys.exit(1)

    result = import_workbook(sys.argv[1])

    print(f"Courses imported: {result['courses_imported']}")
    print(f"Students imported: {result['students_imported']}")
