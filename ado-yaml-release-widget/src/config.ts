import * as SDK from "azure-devops-extension-sdk";

SDK.register("yaml-release-overview-widget-configuration", () => {
  return {
    load: async (settings: any, _size: any) => {
      SDK.init({ loaded: true });
      await SDK.ready();

      const custom = settings.customSettings?.data ? JSON.parse(settings.customSettings.data) : {};
      (document.getElementById("pid") as HTMLInputElement).value = custom.pipelineId ?? "";
      (document.getElementById("runs") as HTMLInputElement).value = (custom.runsToShow ?? 5).toString();

      SDK.notifyLoadSucceeded();
      SDK.resize();

      return {
        onSave: () => {
          const data = JSON.stringify({
            pipelineId: Number((document.getElementById("pid") as HTMLInputElement).value),
            runsToShow: Number((document.getElementById("runs") as HTMLInputElement).value)
          });
          return { customSettings: { data } };
        }
      };
    }
  };
});