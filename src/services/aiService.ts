// src/services/aiService.ts
export async function loadTensorFlow() {
  if (!window.tf) {
    console.log('🔄 Loading TensorFlow.js...');
    window.tf = await import('@tensorflow/tfjs');
    console.log('✅ TensorFlow.js loaded');
  }
  return window.tf;
}