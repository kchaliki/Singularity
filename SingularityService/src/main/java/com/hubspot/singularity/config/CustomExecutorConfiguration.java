package com.hubspot.singularity.config;

import javax.validation.constraints.Min;

public class CustomExecutorConfiguration {
  @Min(0)
  private double numCpus = 0;

  @Min(0)
  private double numGpus = 0;

  @Min(0)
  private int memoryMb = 0;

  @Min(0)
  private int diskMb = 0;

  public double getNumCpus() {
    return numCpus;
  }
  
  public double getNumGpus() {
    return numGpus;
  }

  public void setNumCpus(double numCpus) {
    this.numCpus = numCpus;
  }
  
  public void setNumGpus(double numGpus) {
    this.numGpus = numGpus;
  }

  public int getMemoryMb() {
    return memoryMb;
  }

  public void setMemoryMb(int memoryMb) {
    this.memoryMb = memoryMb;
  }

  public int getDiskMb() {
    return diskMb;
  }

  public void setDiskMb(int diskMb) {
    this.diskMb = diskMb;
  }
}
