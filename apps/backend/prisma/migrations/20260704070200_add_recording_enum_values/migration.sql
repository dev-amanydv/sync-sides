-- New enum values must be committed before they can be used, so they get
-- their own migration ahead of the tables that reference them.
ALTER TYPE "RecordingStatus" ADD VALUE 'recording';
ALTER TYPE "RecordingStatus" ADD VALUE 'failed';
