import { createAndShowModal, createAndShowChallenge, appendLessonSlide } from "../LRM/conditionRenderer.js";

export const displayModalMessage = (params) => {
  createAndShowModal(params);
};

export const handleChallenge = (params) => {
  createAndShowChallenge(params);
};

export const renderTextBlock = (params) => {
  appendLessonSlide(params);
};

export const comingSoon = (params) => {
  console.log("Feature coming soon:", params);
};