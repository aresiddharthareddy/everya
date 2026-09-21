-- Phase 5.6: Document last-editor attribution

ALTER TABLE "Document" ADD COLUMN "lastEditedById" TEXT;
CREATE INDEX "Document_lastEditedById_idx" ON "Document"("lastEditedById");
