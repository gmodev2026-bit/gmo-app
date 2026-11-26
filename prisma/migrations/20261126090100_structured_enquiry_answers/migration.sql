ALTER TABLE "enquiry"
ADD COLUMN "formTemplateVersion" TEXT NOT NULL DEFAULT 'gmo-pilot-v1',
ADD COLUMN "structuredAnswers" JSONB NOT NULL DEFAULT '{}'::jsonb;
