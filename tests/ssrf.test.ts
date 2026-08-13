import { describe, expect, it } from "vitest";
import { isPublicIp, validatePublicUrl } from "@/server/security/ssrf";

describe("SSRF controls", () => {
  it.each([
    "127.0.0.1",
    "10.1.2.3",
    "169.254.169.254",
    "172.16.0.1",
    "192.168.1.1",
    "100.64.0.1",
    "::1",
    "fc00::1",
    "fe80::1",
    "::ffff:127.0.0.1",
  ])("blocks special address %s", (ip) => expect(isPublicIp(ip)).toBe(false));
  it.each(["8.8.8.8", "1.1.1.1", "2606:4700:4700::1111"])("allows public address %s", (ip) =>
    expect(isPublicIp(ip)).toBe(true),
  );
  it("rejects non-http schemes, credentials, internal names, and encoded loopback", async () => {
    await expect(validatePublicUrl("file:///etc/passwd")).rejects.toThrow(/HTTP/);
    await expect(validatePublicUrl("http://user:pass@example.com")).rejects.toThrow(/credentials/);
    await expect(validatePublicUrl("http://localhost:3000/job")).rejects.toThrow(/Local/);
    await expect(validatePublicUrl("http://2130706433/job")).rejects.toThrow(/publicly routable/);
  });
});
