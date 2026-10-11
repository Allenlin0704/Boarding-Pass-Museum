(()=>{
  const language=()=>window.BPM_LANGUAGE||"zh-CN";
  const countryRows=[];
  const selectors=[...document.querySelectorAll("select[data-iso-country]")];
  const displayName=row=>`${row.name_cn} / ${row.name_tw}`;
  const renderValue=picker=>{
    const row=countryRows.find(item=>item.code===picker.select.value);
    picker.button.replaceChildren();
    if(!row){picker.button.textContent=language()==="en"?"Choose a country / area":"请选择国家 / 地区";return;}
    const chinese=document.createElement("span");chinese.className="iso-country-current-cn";chinese.textContent=displayName(row);
    const english=document.createElement("span");english.className="iso-country-current-en";english.textContent=row.name_en;
    const code=document.createElement("small");code.className="iso-country-current-code";code.textContent=row.code;
    picker.button.append(chinese,english,code);
  };
  const match=(row,query)=>[row.code,row.name_cn,row.name_tw,row.name_en].some(value=>String(value||"").toLocaleLowerCase().includes(query));
  const renderOptions=(picker)=>{
    const query=picker.search.value.trim().toLocaleLowerCase();
    const rows=countryRows.filter(row=>!query||match(row,query)).slice(0,100);
    picker.list.replaceChildren();
    for(const row of rows){
      const item=document.createElement("button");item.type="button";item.className="iso-country-option";item.setAttribute("role","option");item.setAttribute("aria-selected",String(picker.select.value===row.code));
      const chinese=document.createElement("strong");chinese.textContent=displayName(row);
      const english=document.createElement("span");english.textContent=row.name_en;
      const code=document.createElement("small");code.textContent=row.code;
      item.append(chinese,english,code);
      item.addEventListener("click",()=>{picker.select.value=row.code;picker.select.dispatchEvent(new Event("change",{bubbles:true}));renderValue(picker);picker.dialog.close();picker.button.focus();});
      picker.list.append(item);
    }
    if(!rows.length){const empty=document.createElement("p");empty.className="iso-country-empty";empty.textContent=language()==="en"?"No matching country or area":"没有匹配的国家或地区";picker.list.append(empty);}
  };
  const init=select=>{
    if(select.dataset.isoPickerReady)return;
    select.dataset.isoPickerReady="1";
    const wrapper=document.createElement("div");wrapper.className="iso-country-picker";
    select.parentNode.insertBefore(wrapper,select);wrapper.append(select);select.classList.add("iso-country-native");select.removeAttribute("required");
    const button=document.createElement("button");button.type="button";button.className="iso-country-trigger";button.setAttribute("aria-haspopup","dialog");
    const dialog=document.createElement("dialog");dialog.className="iso-country-dialog";
    const heading=document.createElement("h2");heading.textContent=language()==="en"?"Choose a country / region":"选择国家 / 地区 · Country / Region";
    const search=document.createElement("input");search.type="search";search.autocomplete="off";search.placeholder=language()==="en"?"Search Chinese, English, or ISO code":"搜索简体中文、繁體中文、英文或 ISO 代码";search.setAttribute("aria-label",search.placeholder);
    const list=document.createElement("div");list.className="iso-country-options";list.setAttribute("role","listbox");
    const close=document.createElement("button");close.type="button";close.className="iso-country-close";close.textContent=language()==="en"?"Close":"关闭";close.addEventListener("click",()=>dialog.close());
    dialog.append(heading,search,list,close);wrapper.append(button,dialog);
    const picker={select,button,dialog,search,list};
    button.addEventListener("click",()=>{search.value="";renderOptions(picker);dialog.showModal();search.focus();});
    search.addEventListener("input",()=>renderOptions(picker));
    select.addEventListener("change",()=>renderValue(picker));
    renderValue(picker);
    select._bpmCountryPicker=picker;
  };
  window.bpmRefreshIsoCountryPicker=select=>{if(select?._bpmCountryPicker)renderValue(select._bpmCountryPicker);};
  window.bpmIsoCountriesReady=fetch("/data/countries-iso3166.json",{cache:"force-cache"}).then(response=>{if(!response.ok)throw Error("国家/地区列表加载失败");return response.json();}).then(rows=>{
    countryRows.push(...rows);
    for(const select of selectors){
      const initial=select.value;
      select.replaceChildren(new Option(language()==="en"?"Choose a country / area":"请选择 ISO 国家 / 地区",""));
      for(const row of countryRows){const option=new Option(`${displayName(row)} · ${row.name_en} · ${row.code}`,row.code);option.dataset.countryCn=row.name_cn;option.dataset.countryTw=row.name_tw;option.dataset.countryEn=row.name_en;select.add(option);}
      select.value=initial;init(select);
    }
    return countryRows;
  });
})();
