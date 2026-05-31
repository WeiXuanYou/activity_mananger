-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "handle" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bio" TEXT,
    "avatarColor" TEXT NOT NULL,
    "initial" TEXT NOT NULL,
    "avatarImage" TEXT,
    "email" TEXT,
    "birthday" DATETIME,
    "setupCompleted" BOOLEAN NOT NULL DEFAULT true,
    "passwordHash" TEXT,
    "roleId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserPermissionGrant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "permissionKey" TEXT NOT NULL,
    "grantedById" TEXT,
    "grantedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserPermissionGrant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserPermissionGrant_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InviteCode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "usedById" TEXT,
    "defaultRoleId" TEXT NOT NULL,
    "reusable" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InviteCode_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InviteCode_usedById_fkey" FOREIGN KEY ("usedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "InviteCode_defaultRoleId_fkey" FOREIGN KEY ("defaultRoleId") REFERENCES "Role" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "description" TEXT
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    PRIMARY KEY ("roleId", "permissionId"),
    CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PermissionRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "currentRoleId" TEXT NOT NULL,
    "requestedRoleId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "decidedById" TEXT,
    "decidedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PermissionRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PermissionRequest_currentRoleId_fkey" FOREIGN KEY ("currentRoleId") REFERENCES "Role" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PermissionRequest_requestedRoleId_fkey" FOREIGN KEY ("requestedRoleId") REFERENCES "Role" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PermissionRequest_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Category_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "cover" TEXT NOT NULL,
    "startsAt" DATETIME NOT NULL,
    "endsAt" DATETIME,
    "visibility" TEXT NOT NULL DEFAULT 'PUBLIC',
    "authorId" TEXT NOT NULL,
    "pollId" TEXT,
    "hiddenAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Activity_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Activity_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "Poll" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ActivityReminder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "activityId" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notifiedUserCount" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ActivityReminder_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "activityId" TEXT NOT NULL,
    "payerId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TWD',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Expense_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Expense_payerId_fkey" FOREIGN KEY ("payerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ActivityParticipant" (
    "activityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "respondedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("activityId", "userId"),
    CONSTRAINT "ActivityParticipant_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ActivityParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ActivityCategory" (
    "activityId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    PRIMARY KEY ("activityId", "categoryId"),
    CONSTRAINT "ActivityCategory_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ActivityCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Poll" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "question" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'STANDARD',
    "multiSelect" BOOLEAN NOT NULL DEFAULT false,
    "anonymous" BOOLEAN NOT NULL DEFAULT false,
    "allowAddOption" BOOLEAN NOT NULL DEFAULT true,
    "closesAt" DATETIME,
    "hiddenAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Poll_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PollOption" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pollId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "addedById" TEXT,
    CONSTRAINT "PollOption_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "Poll" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PollVote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "optionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PollVote_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "PollOption" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PollVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PollCategory" (
    "pollId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    PRIMARY KEY ("pollId", "categoryId"),
    CONSTRAINT "PollCategory_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "Poll" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PollCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "authorId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT,
    "body" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'PUBLIC',
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "pinnedById" TEXT,
    "hiddenAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Post_pinnedById_fkey" FOREIGN KEY ("pinnedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PostCategory" (
    "postId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    PRIMARY KEY ("postId", "categoryId"),
    CONSTRAINT "PostCategory_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PostCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "authorId" TEXT NOT NULL,
    "parentType" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "parentCommentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Comment_parentCommentId_fkey" FOREIGN KEY ("parentCommentId") REFERENCES "Comment" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "Reaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "parentType" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'LIKE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Reaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CustomPage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "cover" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'PUBLIC',
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CustomPage_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CustomPageBlock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pageId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CustomPageBlock_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "CustomPage" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CustomPageCategory" (
    "pageId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    PRIMARY KEY ("pageId", "categoryId"),
    CONSTRAINT "CustomPageCategory_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "CustomPage" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CustomPageCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "link" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PasswordReset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "usedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PasswordReset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kind" TEXT NOT NULL,
    "userId" TEXT,
    "subjectType" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "properties" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Lodging" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "address" TEXT,
    "notes" TEXT,
    "pricePerNightCents" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'TWD',
    "url" TEXT,
    "rating" INTEGER,
    "addedById" TEXT NOT NULL,
    "stayedAt" DATETIME,
    "activityId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Lodging_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Lodging_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_handle_key" ON "User"("handle");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_roleId_idx" ON "User"("roleId");

-- CreateIndex
CREATE INDEX "UserPermissionGrant_userId_idx" ON "UserPermissionGrant"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPermissionGrant_userId_permissionKey_key" ON "UserPermissionGrant"("userId", "permissionKey");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "InviteCode_code_key" ON "InviteCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "InviteCode_usedById_key" ON "InviteCode"("usedById");

-- CreateIndex
CREATE INDEX "InviteCode_createdById_idx" ON "InviteCode"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_key_key" ON "Permission"("key");

-- CreateIndex
CREATE INDEX "PermissionRequest_userId_idx" ON "PermissionRequest"("userId");

-- CreateIndex
CREATE INDEX "PermissionRequest_status_idx" ON "PermissionRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Activity_pollId_key" ON "Activity"("pollId");

-- CreateIndex
CREATE INDEX "Activity_startsAt_idx" ON "Activity"("startsAt");

-- CreateIndex
CREATE INDEX "Activity_authorId_idx" ON "Activity"("authorId");

-- CreateIndex
CREATE INDEX "ActivityReminder_activityId_idx" ON "ActivityReminder"("activityId");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityReminder_activityId_tier_key" ON "ActivityReminder"("activityId", "tier");

-- CreateIndex
CREATE INDEX "Expense_activityId_idx" ON "Expense"("activityId");

-- CreateIndex
CREATE INDEX "Expense_payerId_idx" ON "Expense"("payerId");

-- CreateIndex
CREATE INDEX "PollOption_pollId_idx" ON "PollOption"("pollId");

-- CreateIndex
CREATE UNIQUE INDEX "PollVote_optionId_userId_key" ON "PollVote"("optionId", "userId");

-- CreateIndex
CREATE INDEX "Post_authorId_idx" ON "Post"("authorId");

-- CreateIndex
CREATE INDEX "Post_isPinned_idx" ON "Post"("isPinned");

-- CreateIndex
CREATE INDEX "Comment_parentType_parentId_idx" ON "Comment"("parentType", "parentId");

-- CreateIndex
CREATE INDEX "Comment_parentCommentId_idx" ON "Comment"("parentCommentId");

-- CreateIndex
CREATE INDEX "Reaction_parentType_parentId_idx" ON "Reaction"("parentType", "parentId");

-- CreateIndex
CREATE UNIQUE INDEX "Reaction_userId_parentType_parentId_kind_key" ON "Reaction"("userId", "parentType", "parentId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "CustomPage_slug_key" ON "CustomPage"("slug");

-- CreateIndex
CREATE INDEX "CustomPageBlock_pageId_order_idx" ON "CustomPageBlock"("pageId", "order");

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordReset_tokenHash_key" ON "PasswordReset"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordReset_userId_idx" ON "PasswordReset"("userId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_kind_createdAt_idx" ON "AnalyticsEvent"("kind", "createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_subjectType_subjectId_idx" ON "AnalyticsEvent"("subjectType", "subjectId");

-- CreateIndex
CREATE INDEX "Lodging_region_idx" ON "Lodging"("region");

-- CreateIndex
CREATE INDEX "Lodging_addedById_idx" ON "Lodging"("addedById");
