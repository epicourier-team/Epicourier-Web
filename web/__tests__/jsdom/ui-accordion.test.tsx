import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";

test("renders Accordion with trigger and content", () => {
  render(
    <Accordion type="single" collapsible>
      <AccordionItem value="item-1">
        <AccordionTrigger>Open FAQ</AccordionTrigger>
        <AccordionContent>Hidden content</AccordionContent>
      </AccordionItem>
    </Accordion>
  );

  expect(screen.getByText(/open faq/i)).toBeInTheDocument();
  fireEvent.click(screen.getByText(/open faq/i));
  expect(screen.getByText(/hidden content/i)).toBeInTheDocument();
});
