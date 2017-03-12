import React, { Component } from 'react';
import { Tab, Tabs } from 'react-toolbox/lib/tabs';
import { Switch } from 'react-toolbox/lib/switch';
import { Button } from 'react-toolbox/lib/button';
import { Slider } from 'react-toolbox/lib/slider';
import { Input } from 'react-toolbox/lib/input';
import ChromePromise from 'chrome-promise';
import escapeStringRegexp from 'escape-string-regexp';
import { slug } from '../utils';
const chromep = new ChromePromise({chrome, Promise});

export default class extends Component {

    constructor(props) {
        super(props);

        this.state = {
            jobs: JSON.parse(localStorage.jobs || '[]'),
            activeTab: 0,
            batch: false,
            waitAfterLoading: 0,
            waitBeforeCapture: 0,
            folder: '',
            filters: '',
        };
    }

    componentDidMount() {
        window.addEventListener('storage', () => {
            this.setState({ jobs: JSON.parse(localStorage.jobs) });
        });

        chromep.tabs.query({active: true, currentWindow: true}).then(tabs => {
            const tab = tabs[0];
            this.setState({
                tab: tab,
                filters: '^' + escapeStringRegexp(tab.url),
                folder: slug(tab.title)
            });
        });
    }

    async scan() {
        await chromep.runtime.sendMessage({action: 'newScanJob', settings: this.state});
        //this.setState({ activeTab: 1 });
        window.close();
    }

    render() {

        return (
            <Tabs index={this.state.activeTab} onChange={index => this.setState({ activeTab: index})} inverse>
                <Tab label='New scan' style={{flex: 1}}>
                    <section style={{height: 475}}>
                        <Switch
                            checked={this.state.batch}
                            label="Scan multiple pages"
                            onChange={value => this.setState({ batch: value })}
                        />

                        {this.state.batch ? (
                            <div>
                                <Input
                                    type='text' multiline label='Url filters'
                                    value={this.state.filters}
                                    onChange={filters => this.setState({ filters })}
                                />

                                <Input
                                    type='text' label='Folder'
                                    value={this.state.folder}
                                    onChange={folder => this.setState({ folder })}
                                />

                                <p>Seconds to wait after loading page</p>

                                <Slider
                                    value={this.state.waitAfterLoading}
                                    onChange={value => this.setState({ waitAfterLoading: value })}
                                    min={0} max={5} step={0.1} editable
                                />
                            </div>
                        ) : null}

                        <p>Seconds to wait after each scroll before capturing</p>

                        <Slider
                            value={this.state.waitBeforeCapture}
                            onChange={value => this.setState({ waitBeforeCapture: value })}
                            min={0} max={5} step={0.1} editable
                        />

                    </section>

                    <Button
                        label="Start scan"
                        raised primary
                        disabled={!this.state.tab}
                        onMouseUp={() => this.scan()}
                    />

                </Tab>
                {/*<Tab label='All scans' disabled>*/}
                    {/*All scans!*/}
                {/*</Tab>*/}
            </Tabs>
        );
    }

}