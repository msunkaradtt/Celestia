-- CreateTable
CREATE TABLE "Satellite" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "line1" TEXT NOT NULL,
    "line2" TEXT NOT NULL,

    CONSTRAINT "Satellite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Satellite_name_key" ON "Satellite"("name");
