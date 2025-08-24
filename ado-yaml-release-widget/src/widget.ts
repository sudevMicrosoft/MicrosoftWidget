import * as SDK from "azure-devops-extension-sdk";
import { getClient, CommonServiceIds, IProjectPageService } from "azure-devops-extension-api";
import { PipelinesRestClient } from "azure-devops-extension-api/Pipelines";
import { BuildRestClient } from "azure-devops-extension-api/Build";

type CustomSettings = { pipelineId?: number; runsToShow?: number };

SDK.register("yaml-release-overview-widget", () => {
  return {
    load: async (settings: any, _size: any) => {
      SDK.init({ loaded: true });
      const host = await SDK.ready();
      const projectSvc = await SDK.getService<IProjectPageService>(CommonServiceIds.ProjectPageService);
      const proj = await projectSvc.getProject();

      const custom: CustomSettings = settings.customSettings?.data ? JSON.parse(settings.customSettings.data) : {};
      const runsToShow = custom.runsToShow ?? 5;
      if (!custom.pipelineId) {
        render(`<em>Configure a pipeline in the widget settings.</em>`);
        return;
      }

      const pipelinesClient = await getClient(PipelinesRestClient);
      const buildClient = await getClient(BuildRestClient);
      const runList = await pipelinesClient.listRuns(proj!.name!, custom.pipelineId, { top: runsToShow });

      const items = [];
      for (const run of runList.value ?? []) {
        const timeline = await buildClient.getBuildTimeline(proj!.name!, run.id);
        const stages = (timeline?.records ?? []).filter(r => r.type === "Stage");
        const stageBadges = stages.map(s => badge(s.name!, s.result ?? s.state ?? "unknown")).join(" ");
        items.push(`<li><a href="${run._links?.web?.href}">Run #${run.id}</a> ${statusPill(run.state, run.result)} ${new Date(run.createdDate!).toLocaleString()}<div>${stageBadges}</div></li>`);
      }

      render(`<div class="header"><strong>Pipeline:</strong> <a href="${host.host.uri}${proj!.name}/_build?definitionId=${custom.pipelineId}">${custom.pipelineId}</a></div><ul class="runs">${items.join("") || "<li>No recent runs.</li>"}</ul>`);
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