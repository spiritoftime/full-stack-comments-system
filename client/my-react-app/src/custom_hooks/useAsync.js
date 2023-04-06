import { useCallback, useEffect, useState } from "react";

export function useAsync(func, dependencies = []) {
  const { execute, ...state } = useAsyncInternal(func, dependencies, true);
  useEffect(() => {
    execute();
  }, [execute]);
  return state;
}

export function useAsyncFn(func, dependencies = []) {
  return useAsyncInternal(func, dependencies, false);
}
function useAsyncInternal(func, dependencies, initialLoadingState = false) {
  const [loading, setLoading] = useState(initialLoadingState);
  const [error, setError] = useState();
  const [value, setValue] = useState();
  const execute = useCallback((...params) => {
    setLoading(true);
    return func(...params)
      .then((data) => {
        setValue(data);
        setError(undefined);
        return data;
      })
      .catch((error) => {
        setValue(undefined);
        setError(error); // the error is able to be displayed instead of promise as the error is already set
        return Promise.reject(error);
      })
      .finally(() => setLoading(false));
  }, dependencies); // no array since the default is already a []
  return { loading, error, value, execute };
}
