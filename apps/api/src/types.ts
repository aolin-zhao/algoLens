import type { PythonRunner } from './runner';

export interface ExecutionMessage { jobId: string }
export interface Bindings {
  DB: D1Database;
  OBJECTS: R2Bucket;
  CACHE: KVNamespace;
  EXECUTIONS: Queue<ExecutionMessage>;
  PYTHON_RUNNER: DurableObjectNamespace<PythonRunner>;
  ADMIN_BOOTSTRAP_TOKEN?: string;
  LOCAL_RUNNER_URL?: string;
  APP_ORIGIN: string;
  ADMIN_ORIGIN: string;
}
export interface AuthUser { id: string; email: string; isAdmin: boolean }
export type Variables = { user: AuthUser };
