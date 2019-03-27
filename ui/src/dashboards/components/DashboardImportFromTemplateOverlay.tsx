// Libraries
import React, {PureComponent} from 'react'
import {withRouter, WithRouterProps} from 'react-router'
import {connect} from 'react-redux'
import _ from 'lodash'

// Components
import {Button} from '@influxdata/clockface'
import {Overlay, ResponsiveGridSizer} from 'src/clockface'
import {TemplateSummary} from '@influxdata/influx'
import CardSelectCard from 'src/clockface/components/card_select/CardSelectCard'
import OrgTemplateFetcher from 'src/organizations/components/OrgTemplateFetcher'
// import FancyScrollbar from 'src/shared/components/fancy_scrollbar/FancyScrollbar'

// Types
import {AppState, RemoteDataState} from 'src/types'

interface StateProps {
  templates: TemplateSummary[]
  templateStatus: RemoteDataState
  orgName: string
}

interface State {
  selectedTemplate: TemplateSummary
}

class DashboardImportFromTemplateOverlay extends PureComponent<
  StateProps & WithRouterProps,
  State
> {
  constructor(props) {
    super(props)
    this.state = {
      selectedTemplate: null,
    }
  }

  render() {
    const {selectedTemplate} = this.state

    return (
      <Overlay visible={true}>
        <Overlay.Container maxWidth={800}>
          <Overlay.Heading
            title={`Import Dashboard from a Template`}
            onDismiss={this.onDismiss}
          />
          <Overlay.Body>
            <div className="import-template-overlay">
              <OrgTemplateFetcher orgName={this.props.orgName}>
                <ResponsiveGridSizer columns={3}>
                  {this.templates}
                </ResponsiveGridSizer>
              </OrgTemplateFetcher>
              <div className="import-template-overlay--details">
                <h2>
                  {_.get(selectedTemplate, 'meta.name', 'Select a Template')}
                </h2>
                <p>This is a template description. </p>
              </div>
            </div>
          </Overlay.Body>
          <Overlay.Footer>{this.buttons}</Overlay.Footer>
        </Overlay.Container>
      </Overlay>
    )
  }

  private get templates(): JSX.Element[] {
    const {templates} = this.props
    const {selectedTemplate} = this.state

    return templates.map(t => {
      return (
        <CardSelectCard
          key={t.id}
          onClick={this.selectTemplate(t)}
          checked={_.get(selectedTemplate, 'id', '') === t.id}
          label={t.meta.name}
          hideImage={true}
        />
      )
    })
  }

  private get buttons(): JSX.Element[] {
    return [
      <Button text="Cancel" onClick={this.onDismiss} />,
      <Button text="Create Template" onClick={this.onSubmit} />,
    ]
  }

  private selectTemplate = (selectedTemplate: TemplateSummary) => (): void => {
    this.setState({selectedTemplate})
  }

  private onDismiss = () => {
    const {router} = this.props
    router.goBack()
  }

  private onSubmit = () => {
    this.onDismiss()
  }
}

const mstp = ({templates: {items, status}, orgs}: AppState): StateProps => ({
  templates: items,
  templateStatus: status,
  orgName: _.get(orgs, '0.name', ''),
})

export default connect<StateProps>(
  mstp,
  null
)(withRouter(DashboardImportFromTemplateOverlay))
