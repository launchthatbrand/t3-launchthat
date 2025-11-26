import React from "react";

import { Button } from "@acme/ui/button"; // Assuming you have a Button component

interface AddLessonButtonProps {
  onClick: () => void;
}

export const AddLessonButton: React.FC<AddLessonButtonProps> = ({
  onClick,
}) => {
  return <Button onClick={onClick}>Add Lesson</Button>;
};
