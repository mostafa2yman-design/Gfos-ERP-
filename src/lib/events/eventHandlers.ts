import { ProductionOrder } from '../../types';
import { BusinessEvent } from './eventTypes';
import { getOrderById } from '../storage';

interface WorkflowCallbacks {
  onOrderUpdated: (order: ProductionOrder) => void;
  onOrderDeleted: () => void;
  onNavigate: (tab: 'production' | 'cut' | 'batches' | 'prep' | 'print' | 'sew') => void;
}

export function createOrderWorkflowHandlers(callbacks: WorkflowCallbacks) {
  const { onOrderUpdated, onOrderDeleted, onNavigate } = callbacks;

  const reloadOrder = async (aggregateId: string) => {
    const order = await getOrderById(aggregateId);
    if (order) {
      onOrderUpdated(order);
    }
  };

  return {
    handleProductionOrderSaved: (event: BusinessEvent) => {
      reloadOrder(event.aggregateId);
    },
    
    handleProductionOrderApproved: (event: BusinessEvent) => {
      reloadOrder(event.aggregateId);
      onNavigate('cut');
    },

    handleProductionOrderDeleted: (event: BusinessEvent) => {
      onOrderDeleted();
    },

    handleCutActualEntered: (event: BusinessEvent) => {
      reloadOrder(event.aggregateId);
    },

    handleCutOrderApproved: (event: BusinessEvent) => {
      reloadOrder(event.aggregateId);
      onNavigate('batches');
    },

    handleBatchSplitCompleted: (event: BusinessEvent) => {
      reloadOrder(event.aggregateId);
    },

    handleBatchesLocked: (event: BusinessEvent) => {
      reloadOrder(event.aggregateId);
      onNavigate('prep');
    },

    handlePreparationStarted: (event: BusinessEvent) => {
      reloadOrder(event.aggregateId);
    },

    handlePreparationCompleted: (event: BusinessEvent) => {
      reloadOrder(event.aggregateId);
      onNavigate('print');
    },
    
    handleBatchPreparationCompleted: (event: BusinessEvent) => {
      reloadOrder(event.aggregateId);
    },

    handlePrintEmbroiderySaved: (event: BusinessEvent) => {
      reloadOrder(event.aggregateId);
    },

    handlePrintEmbroideryCompleted: (event: BusinessEvent) => {
      reloadOrder(event.aggregateId);
      onNavigate('sew');
    },

    handleSewingSaved: (event: BusinessEvent) => {
      reloadOrder(event.aggregateId);
    },

    handleSewingCompleted: (event: BusinessEvent) => {
      reloadOrder(event.aggregateId);
    }
  };
}
