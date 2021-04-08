-- CreateTable
CREATE TABLE "Media" (
    "id" SERIAL NOT NULL,
    "aristOrId" TEXT NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "json" TEXT NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Media.aristOrId_unique" ON "Media"("aristOrId");
