export const UI = {
  buttons: {
    save: "Guardar peça",
    saveChanges: "Guardar canvis",
    delete: "Eliminar",
    close: "Tancar",
    clearFilters: "Netejar filtres",
    edit: "Editar",
  },
  form: {
    category: "Categoria",
    colors: "Colors",
    texture: "Textura",
    pattern: "Dibuix",
    seasons: "Temporada",
    size: "Talla",
    subtype: "Tipus",
    length: "Llargada",
    fit: "Tall",
    notes: "Notes",
    required: "*",
  },
  errors: {
    requiredFields: "Omple tots els camps marcats amb *",
    minOneSeason: "Selecciona almenys una temporada",
    minOneColor: "Selecciona almenys un color",
    invalidColor: "Color no valid",
  },
  modal: {
    combine: "Què hi combina",
    texture: "Textura",
    pattern: "Dibuix",
    colors: "Colors",
    seasons: "Temporada",
    notes: "Notes",
  },
  grid: {
    filters: "Filtres",
    categories: "Categoria",
    seasons: "Temporada",
    fits: "Tall",
    textures: "Textura",
    noResults: "Cap peça trobada",
    results: (count: number) => `${count} peça${count !== 1 ? "s" : ""}`,
  },
  bugaderia: {
    title: "bugaderia",
    subtitle: "què tens net i què tens al cistell.",
    today: "Què em poso?",
    viewsLabel: "Quina pila mires",
    views: {
      clean: "netes",
      basket: "cistell",
    },
    picker: {
      soil: {
        subtitle: "tria les peces que van al cistell.",
        submit: "Al cistell",
        submitting: "marcant…",
        empty: "totes les peces ja són al cistell.",
      },
      wash: {
        subtitle: "tria les peces que has rentat.",
        submit: "Rentat",
        submitting: "marcant…",
        empty: "cap peça al cistell. tot net.",
        didLaundry: "he fet la bugada",
      },
      clearSelection: "Desmarcar-ho tot",
    },
    grid: {
      state: "Estat",
      clean: "Netes",
      dirty: "Brutes",
      badge: "al cistell",
    },
  },
  menu: {
    // Everything that is *about* the app rather than in it. When there
    // are accounts the profile, the session and the language switch are
    // rows in this same list.
    label: "Menú",
    stats: "estadístiques",
    settings: "configuració",
    theme: "tema",
    themeLight: "clar",
    themeDark: "fosc",
  },
  outfits: {
    // The screen is one question, so it is titled with the question.
    screenTitle: "Què em poso?",
    /**
     * The three strata of that screen, top to bottom: the answer, the
     * week the answer sits in, and the collection it came from. Same
     * noun at three distances in time, which is why they are one screen.
     */
    sections: {
      today: "avui",
      week: "la setmana",
      all: "tots els outfits",
    },
    // The plate is reserved for what you are actually wearing. It used to
    // show a ranked "proposal" when the day was open, but with a handful
    // of outfits that ranking rarely lands, and showing an arbitrary pick
    // large and first overstates how sure the app is.
    todayUndecided: "encara no ho has decidit",
    chooseToday: "Triar l'outfit d'avui",
    changeToday: "canviar d'outfit",
    filtersLabel: "Filtrar outfits",
    filters: {
      ready: "a punt",
      all: "tots",
    },
    // "a punt" leads: the question is what you can wear now, and an outfit
    // whose shirt is in the basket is not an answer to it.
    filterOrder: ["ready", "all"] as const,
    pickForMe: "tria per mi",
    today: "avui",
    // "al cistell" describes where the piece is; on an outfit what you
    // need to know is what to do about it.
    inBasket: "per rentar",
    blockedReason: (pieces: string[]) => `cal rentar ${pieces.join(" i ")}`,
    howYouWearIt: "com el portes",
    shoes: "sabates",
    accessories: "accessoris",
    socks: "mitjons",
    noShoes: "cap sabata desada.",
    noAccessories: "cap accessori desat.",
    goToAdd: "afegir una peça",
    wearToday: "Me'l poso",
    wearOnDay: (day: string) => `Desar per ${day}`,
    saving: "desant…",
    delete: "eliminar",
    deleteConfirm: "sí, eliminar",
    deleting: "eliminant…",
    cancel: "cancel·lar",
    // The outfit only carries its three most recent past days, so beyond
    // that the count would understate what the cascade really deletes.
    deleteCost: (n: number) =>
      n === 1
        ? "s'esborrarà també 1 dia del calendari."
        : `s'esborraran també ${n} dies del calendari.`,
    deleteCostMany: "s'esborraran també els dies del calendari on el portaves.",
    changeOutfit: "canviar d'outfit",
    removeFromDay: "treure del dia",
    emptyNoOutfits: "encara no tens outfits desats",
    emptyNoOutfitsBrowse: "encara no hi ha res desat.",
    emptyNoOutfitsHint:
      "obre una peça de l'armari i mira què hi combina per desar el primer.",
    emptyNoneReady: "toca fer bugada",
    emptyReady: "cap outfit a punt ara mateix.",
    goToArmari: "anar a l'armari",
    goToRentar: "anar a rentar",
    plan: "planificar",
    back: "tornar",
    planned: "planificat",
  },
} as const;
