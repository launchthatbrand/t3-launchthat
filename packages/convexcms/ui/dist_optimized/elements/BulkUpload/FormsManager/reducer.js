export function formsManagementReducer(state, action) {
  switch (action.type) {
    case "ADD_FORMS":
      {
        const newForms = [];
        for (let i = 0; i < action.files.length; i++) {
          newForms[i] = {
            errorCount: 0,
            formState: {
              ...(action.initialState || {}),
              file: {
                initialValue: action.files[i],
                valid: true,
                value: action.files[i]
              }
            }
          };
        }
        return {
          ...state,
          activeIndex: 0,
          forms: [...newForms, ...state.forms]
        };
      }
    case "REMOVE_FORM":
      {
        const remainingFormStates = [...state.forms];
        const [removedForm] = remainingFormStates.splice(action.index, 1);
        const affectedByShift = state.activeIndex >= action.index;
        const nextIndex = state.activeIndex === action.index ? action.index : affectedByShift ? state.activeIndex - 1 : state.activeIndex;
        const boundedActiveIndex = Math.min(remainingFormStates.length - 1, nextIndex);
        return {
          ...state,
          activeIndex: affectedByShift ? boundedActiveIndex : state.activeIndex,
          forms: remainingFormStates,
          totalErrorCount: state.totalErrorCount - removedForm.errorCount
        };
      }
    case "REPLACE":
      {
        return {
          ...state,
          ...action.state
        };
      }
    case "SET_ACTIVE_INDEX":
      {
        return {
          ...state,
          activeIndex: action.index
        };
      }
    case "UPDATE_ERROR_COUNT":
      {
        const forms = [...state.forms];
        forms[action.index].errorCount = action.count;
        return {
          ...state,
          forms,
          totalErrorCount: state.forms.reduce((acc, form) => acc + form.errorCount, 0)
        };
      }
    case "UPDATE_FORM":
      {
        const updatedForms = [...state.forms];
        updatedForms[action.index].errorCount = action.errorCount;
        // Merge the existing formState with the new formState
        updatedForms[action.index] = {
          ...updatedForms[action.index],
          formState: {
            ...updatedForms[action.index].formState,
            ...action.formState
          }
        };
        return {
          ...state,
          forms: updatedForms,
          totalErrorCount: state.forms.reduce((acc, form) => acc + form.errorCount, 0)
        };
      }
    default:
      {
        return state;
      }
  }
}
//# sourceMappingURL=reducer.js.map