import { h, Component, createRef } from "preact";

export default class InlineSVG extends Component {
  constructor() {
    super();
    this.svgContainer = createRef();
  }

  async componentDidMount() {
    if (this.props.src) {
      var response = await fetch(this.props.src);
      var svgText = await response.text();
      this.base.innerHTML = svgText;
    }
  }

  render(props) {
    return <div class={"inline-svg " + props.class}  role="img" alt=""></div>
  }
}