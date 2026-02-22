import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card.js";

export const Route = createFileRoute("/visuals")({
  component: VisualComponent,
});

function VisualComponent() {
  const { apiBaseUrl } = Route.useRouteContext();

  return (
    <>
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold">Visualizations of ML Model</h1>
        <div className="flex justify-center flex-none w-140 h-140 py-2">
          <Card className="px-4 py-4">
            <img
              src={`${apiBaseUrl}/Visualizations/confusion_matrix.png`}
              alt="vis1"
            />
          </Card>
        </div>
        <div className="flex justify-center flex-none w-140 h-140 py-2">
          <Card className="px-4 py-4">
            <img
              src={`${apiBaseUrl}/Visualizations/learning_curve.png`}
              alt="vis2"
            />
          </Card>
        </div>
        <div className="flex justify-center flex-none w-140 h-140 py-2">
          <Card className="px-4 py-4">
            <img
              src={`${apiBaseUrl}/Visualizations/roc_curve.png`}
              alt="vis3"
            />
          </Card>
        </div>
      </div>
    </>
  );
}
