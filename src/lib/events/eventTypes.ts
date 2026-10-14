export interface BusinessEvent<T = unknown> {
  id: string;
  type: string;
  occurredAt: string;
  aggregateType: string;
  aggregateId: string;
  payload: T;
  metadata?: {
    userId?: string;
    source?: string;
    correlationId?: string;
  };
}

export type EventType = 
  | 'ProductionOrderCreated'
  | 'ProductionOrderSaved'
  | 'ProductionOrderApproved'
  | 'ProductionOrderDeleted'
  | 'ProductionOrderSizeAdded'
  | 'ProductionOrderSizeRemoved'
  | 'ProductionOrderSizeCopied'
  | 'ProductionOrderVariantAdded'
  | 'ProductionOrderVariantUpdated'
  | 'ProductionOrderVariantRemoved'
  | 'CutActualEntered'
  | 'CutOrderApproved'
  | 'BatchesCreated'
  | 'BatchSplitCompleted'
  | 'BatchesLocked'
  | 'PreparationStarted'
  | 'BatchPreparationCompleted'
  | 'PreparationCompleted'
  | 'PrintEmbroiderySaved'
  | 'PrintEmbroideryCompleted'
  | 'SewingSaved'
  | 'SewingCompleted'
  | 'ProductionOrderClosed';
