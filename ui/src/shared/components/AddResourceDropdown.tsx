// Libraries
import React, {PureComponent} from 'react'
import _ from 'lodash'

// Components
import {Dropdown, DropdownMode} from 'src/clockface'

// Types
import {IconFont, ComponentColor, ComponentSize} from '@influxdata/clockface'

interface Props {
  onSelectNew: () => void
  onSelectImport: () => void
  onSelectTemplate?: () => void
  resourceName: string
}

export default class AddResourceDropdown extends PureComponent<Props> {
  public render() {
    return (
      <Dropdown
        mode={DropdownMode.ActionList}
        titleText={`Create ${this.props.resourceName}`}
        icon={IconFont.Plus}
        buttonColor={ComponentColor.Primary}
        buttonSize={ComponentSize.Small}
        widthPixels={160}
        onChange={this.handleSelect}
      >
        {this.optionItems}
      </Dropdown>
    )
  }

  private get optionItems(): JSX.Element[] {
    const importOption = this.importOption
    const newOption = this.newOption
    const templateOption = this.templateOption

    const items = [
      <Dropdown.Item id={newOption} key={newOption} value={newOption}>
        {newOption}
      </Dropdown.Item>,
      <Dropdown.Item id={importOption} key={importOption} value={importOption}>
        {importOption}
      </Dropdown.Item>,
    ]

    if (!!this.props.onSelectTemplate) {
      items.push(
        <Dropdown.Item
          id={templateOption}
          key={templateOption}
          value={templateOption}
        >
          {templateOption}
        </Dropdown.Item>
      )
    }

    return items
  }

  private get newOption(): string {
    return `New ${this.props.resourceName}`
  }

  private get importOption(): string {
    return `Import ${this.props.resourceName}`
  }

  private get templateOption(): string {
    return `From a Template`
  }

  private handleSelect = (selection: string): void => {
    const {onSelectNew, onSelectImport, onSelectTemplate} = this.props

    if (selection === this.newOption) {
      onSelectNew()
    }
    if (selection === this.importOption) {
      onSelectImport()
    }
    if (selection == this.templateOption) {
      onSelectTemplate()
    }
  }
}
