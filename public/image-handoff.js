// Keep large editor images out of sessionStorage, whose quota is small on
// mobile Safari. IndexedDB can store the exported Blob without base64 growth.
(() => {
  const databaseName = "bpm-image-editor-handoff";
  const storeName = "images";

  function openDatabase() {
    return new Promise((resolve, reject) => {
      if (!("indexedDB" in window)) {
        reject(new Error("当前浏览器不支持图片暂存"));
        return;
      }
      const request = indexedDB.open(databaseName, 1);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(storeName)) {
          database.createObjectStore(storeName);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("无法打开图片暂存"));
      request.onblocked = () => reject(new Error("图片暂存正在升级，请刷新后重试"));
    });
  }

  async function transact(mode, action) {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(storeName, mode);
      let result;
      try {
        action(transaction.objectStore(storeName), value => { result = value; }, reject);
      } catch (error) {
        database.close();
        reject(error);
        return;
      }
      transaction.oncomplete = () => {
        database.close();
        resolve(result);
      };
      transaction.onerror = () => {
        database.close();
        reject(transaction.error || new Error("图片暂存失败"));
      };
      transaction.onabort = () => {
        database.close();
        reject(transaction.error || new Error("图片暂存失败"));
      };
    });
  }

  window.bpmImageHandoff = {
    set(key, value) {
      return transact("readwrite", (store, setResult, fail) => {
        const request = store.put(value, key);
        request.onsuccess = () => setResult(request.result);
        request.onerror = () => fail(request.error || new Error("图片暂存失败"));
      });
    },
    take(key) {
      return transact("readwrite", (store, setResult, fail) => {
        const request = store.get(key);
        request.onsuccess = () => {
          setResult(request.result);
          if (request.result !== undefined) store.delete(key);
        };
        request.onerror = () => fail(request.error || new Error("读取暂存图片失败"));
      });
    },
    remove(key) {
      return transact("readwrite", store => { store.delete(key); });
    }
  };
})();
