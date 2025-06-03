/**
 * Simple progress tracker for long-running operations
 */
export class ProgressTracker {
  private startTime: number;
  private lastUpdateTime: number;
  private totalItems: number;
  private completedItems: number;
  private label: string;
  private updateIntervalMs: number;
  private logFunction: (message: string) => void;

  constructor(
    totalItems: number, 
    label = 'Processing', 
    updateIntervalMs = 5000,
    logFunction: (message: string) => void = console.log
  ) {
    this.startTime = Date.now();
    this.lastUpdateTime = this.startTime;
    this.totalItems = totalItems;
    this.completedItems = 0;
    this.label = label;
    this.updateIntervalMs = updateIntervalMs;
    this.logFunction = logFunction;
  }

  /**
   * Update progress and log if appropriate
   */
  update(increment = 1, force = false): void {
    this.completedItems += increment;
    const now = Date.now();
    
    // Only log if it's been at least updateIntervalMs since the last update
    // or if we're forcing an update or at 100%
    if (
      force || 
      now - this.lastUpdateTime >= this.updateIntervalMs ||
      this.completedItems >= this.totalItems
    ) {
      this.lastUpdateTime = now;
      const percentComplete = (this.completedItems / this.totalItems) * 100;
      const elapsedSeconds = (now - this.startTime) / 1000;
      
      let estimatedTotalSeconds = 0;
      let estimatedRemainingSeconds = 0;
      let timeMessage = '';
      
      if (this.completedItems > 0) {
        const itemsPerSecond = this.completedItems / elapsedSeconds;
        estimatedTotalSeconds = this.totalItems / itemsPerSecond;
        estimatedRemainingSeconds = Math.max(0, estimatedTotalSeconds - elapsedSeconds);
        
        timeMessage = ` (${this.formatTime(elapsedSeconds)} elapsed, ${this.formatTime(estimatedRemainingSeconds)} remaining)`;
      }
      
      this.logFunction(
        `${this.label}: ${this.completedItems}/${this.totalItems} (${percentComplete.toFixed(2)}%)${timeMessage}`
      );
    }
  }

  /**
   * Format time in seconds to a human-readable string
   */
  private formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    if (minutes === 0) {
      return `${remainingSeconds}s`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours === 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    
    return `${hours}h ${remainingMinutes}m ${remainingSeconds}s`;
  }

  /**
   * Complete the progress tracking and log final results
   */
  complete(): void {
    this.update(this.totalItems - this.completedItems, true);
    const totalTimeSeconds = (Date.now() - this.startTime) / 1000;
    this.logFunction(`${this.label} completed in ${this.formatTime(totalTimeSeconds)}`);
  }

  /**
   * Get current progress as a number between 0 and 1
   */
  getProgress(): number {
    return this.completedItems / this.totalItems;
  }

  /**
   * Get current progress as a percentage
   */
  getProgressPercent(): number {
    return (this.completedItems / this.totalItems) * 100;
  }
}