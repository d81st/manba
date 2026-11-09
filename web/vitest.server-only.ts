// In tests the "server-only" guard is empty: a test may import a module whose
// entry also exports server code without running that code.
export {};
