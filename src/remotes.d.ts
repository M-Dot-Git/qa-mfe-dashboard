declare module "qa_test_reports/App" {
  import type { ComponentType } from "react";

  interface TestReportsAppProps {
    getAccessToken?: () => Promise<string>;
  }

  const TestReportsApp: ComponentType<TestReportsAppProps>;
  export default TestReportsApp;
}
