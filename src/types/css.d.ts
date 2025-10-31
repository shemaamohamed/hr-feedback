// Type declarations for importing plain CSS files
declare module '*.css';
declare module '*.scss';
declare module '*.sass';

// Add additional static asset types as needed
declare module '*.svg' {
  const content: string;
  export default content;
}
