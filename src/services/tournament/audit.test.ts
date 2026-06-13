import { describe, expect, it, vi } from "vitest";

import { createAuditLog } from "./audit";

describe("createAuditLog", () => {
  it("persists audit entries", async () => {
    const client = {
      auditLog: {
        create: vi.fn(async () => ({}))
      }
    };

    await createAuditLog(client, {
      action: "MATCH_RESULT_REGISTERED",
      entity: "Match",
      entityId: "match-1",
      userId: "user-1",
      metadata: { homeScore: 2, awayScore: 1 }
    });

    expect(client.auditLog.create).toHaveBeenCalledWith({
      data: {
        action: "MATCH_RESULT_REGISTERED",
        entity: "Match",
        entityId: "match-1",
        userId: "user-1",
        metadata: { homeScore: 2, awayScore: 1 }
      }
    });
  });
});
