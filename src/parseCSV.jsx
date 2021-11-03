export class CSVColumn {
  constructor(name, set, alternates = null) {
    this.name = name
    this.alternates = alternates
    this.set = new Set(set)
    this.location = -1
  }

  satisfied(ignore = null) {
    if (this.location !== -1) return true
    if (this.alternates) {
      let satisfied = false
      this.alternates.forEach((v) => {
        if (satisfied) return
        if (ignore && v.name === ignore.name) return
        if (v.satisfied(this)) {
          satisfied = true
        }
      })
      return satisfied
    }
    return false
  }
}

export function parseCSV(file, columnsIn, onRow) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const columns = columnsIn
      let columnsFound = false
      reader.result.split('\n').forEach((line) => {
        const parts = line.split(',')
        if (!columnsFound) {
          let c = 0
          parts.forEach((partLong) => {
            const part = partLong.trim()
            columns.forEach((v, k) => {
              if (v.location !== -1) { return }
              if (v.set.has(part)) {
                columns[k].location = c
              }
            })
            c += 1
          })
          columnsFound = true
          columns.forEach((v) => {
            if (columnsFound === false) { return }
            if (v.satisfied()) { return }
            columnsFound = false
          })
          return
        }
        const row = {}
        columns.forEach((v) => {
          if (v.location === -1) { return }
          row[v.name] = parts[v.location]
        })
        onRow(row)
      })
      if (!columnsFound) {
        columns.forEach((v) => {
          if (!v.satisfied()) {
            reject(Error(`Unable to find '${v.name}' column.  Looking for one of: [${Array.from(v.set).join(', ')}]`))
          }
        })
      }
      resolve()
    }
    reader.readAsText(file)
  })
}

export function parseCSVs(filesIn, columnsIn, onRow) {
  const files = [...filesIn]
  const file = files.shift()
  if (file) {
    return parseCSV(file, columnsIn, onRow)
      .then(() => (files.length > 0 ? parseCSVs(files, columnsIn, onRow) : null))
  }
  return null
}
