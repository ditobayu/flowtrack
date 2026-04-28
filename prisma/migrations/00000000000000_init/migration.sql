CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Membership_userId_projectId_key" ON "Membership"("userId", "projectId");

CREATE TABLE "Board" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'kanban',
    CONSTRAINT "Board_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Column" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Column_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Sprint" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    CONSTRAINT "Sprint_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Label" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6B7280',
    "projectId" TEXT NOT NULL,
    CONSTRAINT "Label_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "columnId" TEXT NOT NULL,
    "assigneeId" TEXT,
    "reporterId" TEXT,
    "dueDate" TIMESTAMP(3),
    "sprintId" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL DEFAULT '',
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TaskLabel" (
    "taskId" TEXT NOT NULL,
    "labelId" TEXT NOT NULL,
    CONSTRAINT "TaskLabel_pkey" PRIMARY KEY ("taskId","labelId")
);

CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL DEFAULT '',
    "actionType" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AutomationRule" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "condition" TEXT NOT NULL DEFAULT '{}',
    "action" TEXT NOT NULL DEFAULT '{}',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "AutomationRule_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Board" ADD CONSTRAINT "Board_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Column" ADD CONSTRAINT "Column_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Sprint" ADD CONSTRAINT "Sprint_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Label" ADD CONSTRAINT "Label_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_columnId_fkey" FOREIGN KEY ("columnId") REFERENCES "Column"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "Sprint"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskLabel" ADD CONSTRAINT "TaskLabel_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskLabel" ADD CONSTRAINT "TaskLabel_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "Label"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
