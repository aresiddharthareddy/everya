-- Phase 4.2: Trace domain (Repository-backed)

-- CreateTable
CREATE TABLE "TraceFollow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "repositoryId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TraceFollow_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TraceFollow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TraceMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "repositoryId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TraceMember_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TraceMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DocumentLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fromDocumentId" TEXT NOT NULL,
    "toDocumentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DocumentLink_fromDocumentId_fkey" FOREIGN KEY ("fromDocumentId") REFERENCES "Document" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DocumentLink_toDocumentId_fkey" FOREIGN KEY ("toDocumentId") REFERENCES "Document" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "TraceFollow_repositoryId_userId_key" ON "TraceFollow"("repositoryId", "userId");
CREATE INDEX "TraceFollow_userId_idx" ON "TraceFollow"("userId");
CREATE UNIQUE INDEX "TraceMember_repositoryId_userId_key" ON "TraceMember"("repositoryId", "userId");
CREATE INDEX "TraceMember_userId_idx" ON "TraceMember"("userId");
CREATE UNIQUE INDEX "DocumentLink_fromDocumentId_toDocumentId_type_key" ON "DocumentLink"("fromDocumentId", "toDocumentId", "type");
CREATE INDEX "DocumentLink_toDocumentId_idx" ON "DocumentLink"("toDocumentId");
