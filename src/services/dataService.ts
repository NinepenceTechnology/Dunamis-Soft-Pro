import { 
  collection, 
  onSnapshot, 
  query, 
  addDoc, 
  serverTimestamp, 
  doc, 
  getDoc, 
  setDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  where,
  QueryConstraint
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

export const createService = (collectionName: string) => {
  return {
    subscribe: (callback: (data: any[]) => void, constraints: QueryConstraint[] = []) => {
      const q = query(collection(db, collectionName), ...constraints);
      return onSnapshot(q, 
        (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
        (err) => handleFirestoreError(err, OperationType.LIST, collectionName)
      );
    },
    add: async (data: any) => {
      try {
        return await addDoc(collection(db, collectionName), {
          ...data,
          createdAt: serverTimestamp()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, collectionName);
      }
    },
    update: async (id: string, data: any) => {
      try {
        const ref = doc(db, collectionName, id);
        return await updateDoc(ref, {
          ...data,
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, collectionName);
      }
    },
    remove: async (id: string) => {
      try {
        const ref = doc(db, collectionName, id);
        return await deleteDoc(ref);
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, collectionName);
      }
    }
  };
};

export const customerService = createService('customers');
export const productService = createService('products');
export const invoiceService = createService('invoices');
export const supplierService = createService('suppliers');
export const hrService = createService('hr_records');
export const storeService = createService('stores');
export const appointmentService = createService('appointments');
export const treatmentService = createService('treatments');
export const expenseService = createService('expenses');
export const staffService = createService('staff');
export const auditService = createService('audit_logs');
