ALTER TABLE "BioFeedback"
ADD COLUMN "globalJointComfortScore" INTEGER;

UPDATE "BioFeedback"
SET "globalJointComfortScore" = 0
WHERE "globalJointComfortScore" IS NULL;

ALTER TABLE "BioFeedback"
ALTER COLUMN "globalJointComfortScore" SET NOT NULL;
