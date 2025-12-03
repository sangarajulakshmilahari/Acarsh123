import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface Employee {
  id: number;
  name: string;
  role: string;
  email: string;
  salary: number;
  region: string;
  status: string;
  
}

interface EmployeesState {
  list: Employee[];
}

const initialState: EmployeesState = {
  list: []
};

const employeesSlice = createSlice({
  name: "employees",
  initialState,
  reducers: {
    setEmployees(state, action: PayloadAction<Employee[]>) {
      state.list = action.payload;
    },
    addEmployee(state, action: PayloadAction<Employee>) {
      state.list.push(action.payload);
    },
    updateEmployee(state, action: PayloadAction<Employee>) {
      const idx = state.list.findIndex(e => e.id === action.payload.id);
      if (idx >= 0) state.list[idx] = action.payload;
    },
    removeEmployee(state, action: PayloadAction<number>) {
      state.list = state.list.filter(e => e.id !== action.payload);
    }
  }
});

export const { setEmployees, addEmployee, updateEmployee, removeEmployee } = employeesSlice.actions;
export default employeesSlice.reducer;
