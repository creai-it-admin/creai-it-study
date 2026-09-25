CREATE TABLE "BlogPost" (
 "id" TEXT NOT NULL,
 "slug" TEXT NOT NULL,
 "draft" JSONB NOT NULL,
 "published" JSONB,
 "publishedAt" TIMESTAMP(3),
 "publishedUpdatedAt" TIMESTAMP(3),
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "BlogPost_slug_key" ON "BlogPost"("slug");
CREATE INDEX "BlogPost_publishedAt_id_idx" ON "BlogPost"("publishedAt", "id");
ALTER TABLE "BlogPost" ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN REVOKE ALL ON "BlogPost" FROM anon; END IF;
 IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN REVOKE ALL ON "BlogPost" FROM authenticated; END IF;
END $$;
