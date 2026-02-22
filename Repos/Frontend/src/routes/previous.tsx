import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion.js";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.js";

import { Card } from '@/components/ui/card.js';


export const Route = createFileRoute("/previous")({
  component: RouteComponent,
});


function RouteComponent() {
  const { apiBaseUrl } = Route.useRouteContext()

  const { data: emails } = useQuery({
    queryKey: ["emails"],
    queryFn: async () =>
      await fetch(`${apiBaseUrl}/emails`).then((res) => res.json()),
  });

  return (
    <>
    <div class="flex flex-col min-h-screen">
      <h1 className="text-2xl font-bold">Previous Predictions:</h1>
      <div className="grow">
      <Accordion collapsible>
        {emails?.toReversed().map((email) => (
            <Card key={email.email_id} className="px-4 py-4 hover:bg-sky-700 rounded-lg transition-colors duration-200 dark:text-white">
            <AccordionItem value={email.email_id.toString().replaceAll('\n', '')}>
              <AccordionTrigger>
                {email.text}
              </AccordionTrigger>
              <AccordionContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-left">Prediction ID</TableHead>
                      <TableHead className="text-center">Source Type</TableHead>
                      <TableHead className="text-center">Created At</TableHead>
                      <TableHead className="text-right">
                        My Model Predicts
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {email.predictions?.map((prediction) => (
                      <TableRow key={prediction.prediction_id}>
                        <TableCell className="text-left">
                          {prediction.prediction_id}
                        </TableCell>
                        <TableCell className="text-center">
                          {prediction.prediction_type}
                        </TableCell>
                        <TableCell className="text-center">
                          {prediction.created_at}
                        </TableCell>
                        <TableCell className="text-right">
                          {prediction.my_model_predicts_spam ? "Spam" : "Ham"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </AccordionContent>
            </AccordionItem>
            </Card>
          ))}
      </Accordion>
      </div>
      </div>
    </>
  );
}
