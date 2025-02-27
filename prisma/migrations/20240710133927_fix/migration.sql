/*
  Warnings:

  - You are about to drop the column `trip_id` on the `participants` table. All the data in the column will be lost.
  - Added the required column `tripId` to the `participants` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_participants" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "is_confirmed" BOOLEAN NOT NULL DEFAULT false,
    "is_owner" BOOLEAN NOT NULL DEFAULT false,
    "tripId" TEXT NOT NULL,
    CONSTRAINT "participants_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_participants" ("email", "id", "is_confirmed", "is_owner", "name") SELECT "email", "id", "is_confirmed", "is_owner", "name" FROM "participants";
DROP TABLE "participants";
ALTER TABLE "new_participants" RENAME TO "participants";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
