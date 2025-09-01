import * as SDK from "azure-devops-extension-sdk";
import { getClient, CommonServiceIds, IProjectPageService } from "azure-devops-extension-api";
import { BuildRestClient } from "azure-devops-extension-api/Build";

type CustomSettings = { pipelineId?: number; runsToShow?: number };

SDK.register("yaml-release-overview-widget", () => {
  return {
    load: async (settings: any, _size: any) => {
      SDK.init({ loaded: true });
      await SDK.ready();
      const hostCtx = SDK.getHost();
      const projectSvc = await SDK.getService<IProjectPageService>(CommonServiceIds.ProjectPageService);
      const proj = await projectSvc.getProject();

      const custom: CustomSettings = settings.customSettings?.data ? JSON.parse(settings.customSettings.data) : {};
      const runsToShow = custom.runsToShow ?? 5;
      if (!custom.pipelineId) {
        render(`<em>Configure a pipeline in the widget settings.</em>`);
        return;
      }

      const buildClient = await getClient(BuildRestClient);
      const builds = await buildClient.getBuilds(
        proj!.name!,
        [custom.pipelineId],
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        runsToShow
      );

      const items: string[] = [];
      for (const build of builds) {
        try {
          const timeline = await buildClient.getBuildTimeline(proj!.name!, build.id);
          const stages = (timeline?.records ?? []).filter(r => r.type === "Stage");
          const stageBadges = stages.map(s => badge(s.name!, String(s.result ?? s.state ?? "unknown"))).join(" ");
          const created = (build.queueTime || build.startTime || build.finishTime) ? new Date((build.queueTime || build.startTime || build.finishTime)!).toLocaleString() : "";
          items.push(`<li><a href="${build._links?.web?.href}">Build #${build.id}</a> ${statusPill(String(build.status), String(build.result))} ${created}<div>${stageBadges}</div></li>`);
        } catch {
          items.push(`<li>Build #${build.id} (error loading timeline)</li>`);
        }
      }

      render(`<div class="header"><strong>Pipeline:</strong> <a href="${hostCtx?.name ? hostCtx.name : ""}${proj!.name}/_build?definitionId=${custom.pipelineId}">${custom.pipelineId}</a></div><ul class="runs">${items.join("") || "<li>No recent builds.</li>"}</ul>`);
    },
    reload: async (_settings: any) => {}
  };
});

function render(html: string) {
  const root = document.getElementById("app")!;
  root.innerHTML = css() + html;
}

function badge(name: string, state: string) {
  const color = /succeeded|success/i.test(state) ? "#107c10"
    : /failed|canceled/i.test(state) ? "#d13438" : "#605e5c";
  return `<span style="display:inline-block;margin:2px 4px;padding:2px 6px;border-radius:4px;background:${color};color:#fff;font-size:11px">${name}: ${state}</span>`;
}

function statusPill(state?: string, result?: string) {
  const txt = result || state || "unknown";
  return badge("run", txt);
}

function css() {
  return `<style>
    .header { margin-bottom: 8px; }
    .runs { list-style: none; padding-left: 0; }
    .runs li { margin-bottom: 6px; }
  </style>`;
}