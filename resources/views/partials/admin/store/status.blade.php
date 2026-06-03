<ul class="list-unstyled" style="margin-bottom: 0;">
    <li>
        @if($status['stripe_secret'])
            <i class="fa fa-check text-success"></i>
        @else
            <i class="fa fa-times text-danger"></i>
        @endif
        Stripe secret key configured
    </li>
    <li>
        @if($status['webhook_secret'])
            <i class="fa fa-check text-success"></i>
        @else
            <i class="fa fa-times text-danger"></i>
        @endif
        Webhook signing secret configured
    </li>
    <li>
        @if($status['price_ids'])
            <i class="fa fa-check text-success"></i>
        @else
            <i class="fa fa-times text-danger"></i>
        @endif
        All plan price IDs configured
    </li>
    <li>
        @if($status['egg'])
            <i class="fa fa-check text-success"></i>
        @else
            <i class="fa fa-times text-danger"></i>
        @endif
        Default provisioning egg selected
    </li>
</ul>
