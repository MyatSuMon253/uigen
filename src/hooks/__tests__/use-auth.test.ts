import { describe, test, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAuth } from "@/hooks/use-auth";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/actions", () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock("@/lib/anon-work-tracker", () => ({
  getAnonWorkData: vi.fn(),
  clearAnonWork: vi.fn(),
}));

vi.mock("@/actions/get-projects", () => ({
  getProjects: vi.fn(),
}));

vi.mock("@/actions/create-project", () => ({
  createProject: vi.fn(),
}));

import { signIn as signInAction, signUp as signUpAction } from "@/actions";
import { getAnonWorkData, clearAnonWork } from "@/lib/anon-work-tracker";
import { getProjects } from "@/actions/get-projects";
import { createProject } from "@/actions/create-project";

const anonWorkWithMessages = {
  messages: [{ id: "1", role: "user", content: "hello" }],
  fileSystemData: { "/App.tsx": { type: "file", content: "code" } },
};

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("initial state", () => {
    test("isLoading starts as false", () => {
      const { result } = renderHook(() => useAuth());
      expect(result.current.isLoading).toBe(false);
    });

    test("returns signIn and signUp functions", () => {
      const { result } = renderHook(() => useAuth());
      expect(typeof result.current.signIn).toBe("function");
      expect(typeof result.current.signUp).toBe("function");
    });
  });

  describe("signIn", () => {
    test("sets isLoading to true during call and false after", async () => {
      let resolveSignIn!: (value: any) => void;
      (signInAction as any).mockReturnValue(
        new Promise((r) => (resolveSignIn = r))
      );

      const { result } = renderHook(() => useAuth());

      let signInPromise: Promise<any>;
      act(() => {
        signInPromise = result.current.signIn("a@b.com", "pass");
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveSignIn({ success: false, error: "Invalid credentials" });
        await signInPromise;
      });

      expect(result.current.isLoading).toBe(false);
    });

    test("returns the result from signInAction", async () => {
      const errorResult = { success: false, error: "Invalid credentials" };
      (signInAction as any).mockResolvedValue(errorResult);

      const { result } = renderHook(() => useAuth());
      const returned = await act(() =>
        result.current.signIn("a@b.com", "wrongpass")
      );

      expect(returned).toEqual(errorResult);
    });

    test("calls signInAction with email and password", async () => {
      (signInAction as any).mockResolvedValue({ success: false });

      const { result } = renderHook(() => useAuth());
      await act(() => result.current.signIn("user@test.com", "mypassword"));

      expect(signInAction).toHaveBeenCalledWith("user@test.com", "mypassword");
    });

    test("does not call handlePostSignIn on failure", async () => {
      (signInAction as any).mockResolvedValue({ success: false, error: "err" });

      const { result } = renderHook(() => useAuth());
      await act(() => result.current.signIn("a@b.com", "pass"));

      expect(getAnonWorkData).not.toHaveBeenCalled();
      expect(getProjects).not.toHaveBeenCalled();
      expect(createProject).not.toHaveBeenCalled();
    });

    test("sets isLoading to false even if signInAction throws", async () => {
      (signInAction as any).mockRejectedValue(new Error("network error"));

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("a@b.com", "pass").catch(() => {});
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("signUp", () => {
    test("sets isLoading to true during call and false after", async () => {
      let resolveSignUp!: (value: any) => void;
      (signUpAction as any).mockReturnValue(
        new Promise((r) => (resolveSignUp = r))
      );

      const { result } = renderHook(() => useAuth());

      let signUpPromise: Promise<any>;
      act(() => {
        signUpPromise = result.current.signUp("a@b.com", "pass");
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveSignUp({ success: false });
        await signUpPromise;
      });

      expect(result.current.isLoading).toBe(false);
    });

    test("returns the result from signUpAction", async () => {
      const errorResult = { success: false, error: "Email already registered" };
      (signUpAction as any).mockResolvedValue(errorResult);

      const { result } = renderHook(() => useAuth());
      const returned = await act(() =>
        result.current.signUp("existing@test.com", "password123")
      );

      expect(returned).toEqual(errorResult);
    });

    test("calls signUpAction with email and password", async () => {
      (signUpAction as any).mockResolvedValue({ success: false });

      const { result } = renderHook(() => useAuth());
      await act(() => result.current.signUp("new@test.com", "securepass"));

      expect(signUpAction).toHaveBeenCalledWith("new@test.com", "securepass");
    });

    test("does not call handlePostSignIn on failure", async () => {
      (signUpAction as any).mockResolvedValue({ success: false, error: "err" });

      const { result } = renderHook(() => useAuth());
      await act(() => result.current.signUp("a@b.com", "pass"));

      expect(getAnonWorkData).not.toHaveBeenCalled();
    });

    test("sets isLoading to false even if signUpAction throws", async () => {
      (signUpAction as any).mockRejectedValue(new Error("server error"));

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp("a@b.com", "pass").catch(() => {});
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("handlePostSignIn — anon work with messages", () => {
    beforeEach(() => {
      (signInAction as any).mockResolvedValue({ success: true });
      (signUpAction as any).mockResolvedValue({ success: true });
    });

    test("creates project from anon work and redirects", async () => {
      (getAnonWorkData as any).mockReturnValue(anonWorkWithMessages);
      (createProject as any).mockResolvedValue({ id: "proj-1" });

      const { result } = renderHook(() => useAuth());
      await act(() => result.current.signIn("a@b.com", "pass"));

      expect(createProject).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: anonWorkWithMessages.messages,
          data: anonWorkWithMessages.fileSystemData,
        })
      );
      expect(clearAnonWork).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/proj-1");
    });

    test("does not call getProjects when anon work exists", async () => {
      (getAnonWorkData as any).mockReturnValue(anonWorkWithMessages);
      (createProject as any).mockResolvedValue({ id: "proj-1" });

      const { result } = renderHook(() => useAuth());
      await act(() => result.current.signIn("a@b.com", "pass"));

      expect(getProjects).not.toHaveBeenCalled();
    });

    test("project name includes current time", async () => {
      (getAnonWorkData as any).mockReturnValue(anonWorkWithMessages);
      (createProject as any).mockResolvedValue({ id: "proj-1" });

      const { result } = renderHook(() => useAuth());
      await act(() => result.current.signIn("a@b.com", "pass"));

      const callArg = (createProject as any).mock.calls[0][0];
      expect(callArg.name).toMatch(/^Design from /);
    });

    test("works the same for signUp", async () => {
      (getAnonWorkData as any).mockReturnValue(anonWorkWithMessages);
      (createProject as any).mockResolvedValue({ id: "proj-2" });

      const { result } = renderHook(() => useAuth());
      await act(() => result.current.signUp("a@b.com", "pass"));

      expect(clearAnonWork).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/proj-2");
    });
  });

  describe("handlePostSignIn — no anon work, existing projects", () => {
    beforeEach(() => {
      (signInAction as any).mockResolvedValue({ success: true });
      (getAnonWorkData as any).mockReturnValue(null);
      (getProjects as any).mockResolvedValue([
        { id: "existing-1", name: "My Design" },
        { id: "existing-2", name: "Old Design" },
      ]);
    });

    test("redirects to most recent project", async () => {
      const { result } = renderHook(() => useAuth());
      await act(() => result.current.signIn("a@b.com", "pass"));

      expect(mockPush).toHaveBeenCalledWith("/existing-1");
    });

    test("does not create a new project", async () => {
      const { result } = renderHook(() => useAuth());
      await act(() => result.current.signIn("a@b.com", "pass"));

      expect(createProject).not.toHaveBeenCalled();
    });
  });

  describe("handlePostSignIn — no anon work, no projects", () => {
    beforeEach(() => {
      (signInAction as any).mockResolvedValue({ success: true });
      (getAnonWorkData as any).mockReturnValue(null);
      (getProjects as any).mockResolvedValue([]);
      (createProject as any).mockResolvedValue({ id: "new-proj" });
    });

    test("creates a new blank project and redirects", async () => {
      const { result } = renderHook(() => useAuth());
      await act(() => result.current.signIn("a@b.com", "pass"));

      expect(createProject).toHaveBeenCalledWith(
        expect.objectContaining({ messages: [], data: {} })
      );
      expect(mockPush).toHaveBeenCalledWith("/new-proj");
    });

    test("new project name matches expected format", async () => {
      const { result } = renderHook(() => useAuth());
      await act(() => result.current.signIn("a@b.com", "pass"));

      const callArg = (createProject as any).mock.calls[0][0];
      expect(callArg.name).toMatch(/^New Design #\d+$/);
    });
  });

  describe("handlePostSignIn — anon work with empty messages", () => {
    test("falls through to getProjects when anon messages array is empty", async () => {
      (signInAction as any).mockResolvedValue({ success: true });
      (getAnonWorkData as any).mockReturnValue({
        messages: [],
        fileSystemData: {},
      });
      (getProjects as any).mockResolvedValue([{ id: "proj-x" }]);

      const { result } = renderHook(() => useAuth());
      await act(() => result.current.signIn("a@b.com", "pass"));

      expect(getProjects).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/proj-x");
    });
  });
});
