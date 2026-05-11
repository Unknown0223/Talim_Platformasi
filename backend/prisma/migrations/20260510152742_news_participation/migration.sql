-- AlterTable
ALTER TABLE "NewsItem" ADD COLUMN     "maxParticipants" INTEGER,
ADD COLUMN     "prize" TEXT,
ADD COLUMN     "requiresParticipation" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "NewsParticipant" (
    "id" TEXT NOT NULL,
    "newsId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isWinner" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "NewsParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NewsParticipant_newsId_idx" ON "NewsParticipant"("newsId");

-- CreateIndex
CREATE INDEX "NewsParticipant_userId_idx" ON "NewsParticipant"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "NewsParticipant_newsId_userId_key" ON "NewsParticipant"("newsId", "userId");

-- AddForeignKey
ALTER TABLE "NewsParticipant" ADD CONSTRAINT "NewsParticipant_newsId_fkey" FOREIGN KEY ("newsId") REFERENCES "NewsItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsParticipant" ADD CONSTRAINT "NewsParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
